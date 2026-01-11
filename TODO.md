# Project Roadmap & TODOs

## 🚀 Future Improvements (v2.2+)

### Strategic Improvements

- [ ] **Implement "Soft Restart Session" Logic**
  - **Context**: Currently, when `max_segments_reached` (safety cap) is hit, the recorder merges the segments and stops execution completely.
  - **Issue**: Extremely long streams (8-12+ hours) will stop recording once the segment limit is reached, potentially missing the remainder of the stream.
  - **Proposed Solution**: instead of exiting, the system should:
    1. Perform the merge of current segments.
    2. Reset the segment counter and internal state.
    3. Check `isRoomAlive`.
    4. If alive, seamlessly start a new recording session (chaining).
  - **Priority**: Important but not urgent (Stability trade-off).

## 🐛 Known Issues / Limitations

- **No Automatic Recovery from "Downgrade Lock"**: While v2.1.1 introduces quality upgrades, extreme network fluctuations might still leave a stream in SD quality if the "clean segment" counter constantly resets.
