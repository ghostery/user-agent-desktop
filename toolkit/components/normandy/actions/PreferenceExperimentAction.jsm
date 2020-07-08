/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { BaseStudyAction } = ChromeUtils.import(
  "resource://normandy/actions/BaseStudyAction.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "Sampling",
  "resource://gre/modules/components-utils/Sampling.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "ActionSchemas",
  "resource://normandy/actions/schemas/index.js"
);
ChromeUtils.defineModuleGetter(
  this,
  "ClientEnvironment",
  "resource://normandy/lib/ClientEnvironment.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "PreferenceExperiments",
  "resource://normandy/lib/PreferenceExperiments.jsm"
);

var EXPORTED_SYMBOLS = ["PreferenceExperimentAction"];

/**
 * Enrolls a user in a preference experiment, in which we assign the
 * user to an experiment branch and modify a preference temporarily to
 * measure how it affects Firefox via Telemetry.
 */
class PreferenceExperimentAction extends BaseStudyAction {
  get schema() {
    return ActionSchemas["multi-preference-experiment"];
  }

  constructor() {
    super();
    this.seenExperimentSlugs = [];
  }

  async _run(recipe) {
    const {
      branches,
      isHighPopulation,
      isEnrollmentPaused,
      slug,
      userFacingName,
      userFacingDescription,
    } = recipe.arguments;

    this.seenExperimentSlugs.push(slug);

    // If we're not in the experiment, enroll!
    const hasSlug = await PreferenceExperiments.has(slug);
    if (!hasSlug) {
      // Check all preferences that could be used by this experiment.
      // If there's already an active experiment that has set that preference, abort.
      const activeExperiments = await PreferenceExperiments.getAllActive();
      for (const branch of branches) {
        const conflictingPrefs = Object.keys(branch.preferences).filter(
          preferenceName => {
            return activeExperiments.some(exp =>
              exp.preferences.hasOwnProperty(preferenceName)
            );
          }
        );
        if (conflictingPrefs.length) {
          throw new Error(
            `Experiment ${slug} ignored; another active experiment is already using the
            ${conflictingPrefs[0]} preference.`
          );
        }
      }

      // Determine if enrollment is currently paused for this experiment.
      if (isEnrollmentPaused) {
        this.log.debug(`Enrollment is paused for experiment "${slug}"`);
        return;
      }

      // Otherwise, enroll!
      const branch = await this.chooseBranch(slug, branches);
      const experimentType = isHighPopulation ? "exp-highpop" : "exp";
      await PreferenceExperiments.start({
        slug,
        actionName: this.name,
        branch: branch.slug,
        preferences: branch.preferences,
        experimentType,
        userFacingName,
        userFacingDescription,
      });
    } else {
      // If the experiment exists, and isn't expired, bump the lastSeen date.
      const experiment = await PreferenceExperiments.get(slug);
      if (experiment.expired) {
        this.log.debug(`Experiment ${slug} has expired, aborting.`);
      } else {
        await PreferenceExperiments.markLastSeen(slug);
      }
    }
  }

  async chooseBranch(slug, branches) {
    const ratios = branches.map(branch => branch.ratio);
    const userId = ClientEnvironment.userId;

    // It's important that the input be:
    // - Unique per-user (no one is bucketed alike)
    // - Unique per-experiment (bucketing differs across multiple experiments)
    // - Differs from the input used for sampling the recipe (otherwise only
    //   branches that contain the same buckets as the recipe sampling will
    //   receive users)
    const input = `${userId}-${slug}-branch`;

    const index = await Sampling.ratioSample(input, ratios);
    return branches[index];
  }

  /**
   * End any experiments which we didn't see during this session.
   * This is the "normal" way experiments end, as they are disabled on
   * the server and so we stop seeing them.  This can also happen if
   * the user doesn't match the filter any more.
   */
  async _finalize() {
    const activeExperiments = await PreferenceExperiments.getAllActive();
    return Promise.all(
      activeExperiments.map(experiment => {
        if (this.name != experiment.actionName) {
          // Another action is responsible for cleaning this one
          // up. Leave it alone.
          return null;
        }

        if (this.seenExperimentSlugs.includes(experiment.slug)) {
          return null;
        }

        return PreferenceExperiments.stop(experiment.slug, {
          resetValue: true,
          reason: "recipe-not-seen",
        }).catch(e => {
          this.log.warn(`Stopping experiment ${experiment.slug} failed: ${e}`);
        });
      })
    );
  }
}
