; ============================================================
; test_exceptions.ll — Exception Handling (Always Protected)
; Category: Exception Handling | Difficulty: Expert
;
; invoke + landingpad are part of the unwind table — they
; define what happens when an exception propagates.
; Removing them would break the exception ABI.
; Dead arithmetic inside handler blocks is still removable.
; ============================================================

define i32 @exception_demo(i32 %x) personality ptr @__gxx_personality_v0 {
entry:
  %dead_pre = add i32 %x, 100       ; DEAD

  ; invoke = call + exception edge
  %result = invoke i32 @may_throw(i32 %x)
              to label %normal unwind label %lpad  ; PROTECTED

normal:
  %dead_post = mul i32 %result, 3   ; DEAD
  ret i32 %result

lpad:
  ; landingpad is an exception handler entry — always protected
  %pad = landingpad { ptr, i32 } catch ptr @type_info  ; PROTECTED

  %dead_in_lpad = add i32 %x, 999   ; DEAD
  ret i32 -1
}

@type_info = external global ptr
declare i32 @may_throw(i32)
declare i32 @__gxx_personality_v0(...)
