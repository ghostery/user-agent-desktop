use super::emitter::BytecodeOffset;
use crate::ast_emitter::AstEmitter;

#[derive(Debug)]
pub enum JumpKind {
    Coalesce,
    LogicalAnd,
    LogicalOr,
    IfEq,
    Goto,
}

#[derive(Debug)]
#[must_use]
pub struct JumpPatchEmitter {
    offset: BytecodeOffset,
    depth: usize,
}
impl JumpPatchEmitter {
    pub fn patch_merge(self, emitter: &mut AstEmitter) {
        // TODO: if multiple jumps arrive at same point, only single JumpTarget
        // should be emitted. See:
        // https://searchfox.org/mozilla-central/rev/49ed791eec93335abfe6c2880f84c324e73e47e6/js/src/frontend/BytecodeEmitter.cpp#371-377
        emitter.emit.patch_jump_target(vec![self.offset]);
        emitter.emit.jump_target();

        // If the previous opcode fall-through, it should have the same stack
        // depth.
        debug_assert!(emitter.emit.stack_depth() == self.depth);
    }

    pub fn patch_not_merge(self, emitter: &mut AstEmitter) {
        // TODO: if multiple jumps arrive at same point, only single JumpTarget
        // should be emitted. See:
        // https://searchfox.org/mozilla-central/rev/49ed791eec93335abfe6c2880f84c324e73e47e6/js/src/frontend/BytecodeEmitter.cpp#371-377
        emitter.emit.patch_jump_target(vec![self.offset]);
        emitter.emit.jump_target();

        // If the previous opcode doesn't fall-through, overwrite the stack
        // depth.
        emitter.emit.set_stack_depth(self.depth);
    }
}

// Struct for emitting bytecode for forward jump.
#[derive(Debug)]
pub struct ForwardJumpEmitter {
    pub jump: JumpKind,
}
impl ForwardJumpEmitter {
    pub fn emit(&mut self, emitter: &mut AstEmitter) -> JumpPatchEmitter {
        let offset = emitter.emit.bytecode_offset();
        self.emit_jump(emitter);
        let depth = emitter.emit.stack_depth();

        // The JITs rely on a jump target being emitted after the
        // conditional jump
        if self.should_fallthrough() {
            emitter.emit.jump_target();
        }
        JumpPatchEmitter { offset, depth }
    }

    fn should_fallthrough(&mut self) -> bool {
        // a fallthrough occurs if the jump is a conditional jump and if the
        // condition doesn't met, the execution goes to the next opcode
        // instead of the target of the jump.
        match self.jump {
            JumpKind::Goto { .. } => false,
            _ => true,
        }
    }

    fn emit_jump(&mut self, emitter: &mut AstEmitter) {
        // in the c++ bytecode emitter, the jumplist is emitted
        // and four bytes are used in order to save memory. We are not using that
        // here, so instead we are using a placeholder offset set to 0, which will
        // be updated later in patch_jump_target.
        let placeholder_offset: i32 = 0;
        match self.jump {
            JumpKind::Coalesce { .. } => {
                emitter.emit.coalesce(placeholder_offset);
            }
            JumpKind::LogicalOr { .. } => {
                emitter.emit.or_(placeholder_offset);
            }
            JumpKind::LogicalAnd { .. } => {
                emitter.emit.and_(placeholder_offset);
            }
            JumpKind::IfEq { .. } => {
                emitter.emit.if_eq(placeholder_offset);
            }
            JumpKind::Goto { .. } => {
                emitter.emit.goto_(placeholder_offset);
            }
        }
    }
}
