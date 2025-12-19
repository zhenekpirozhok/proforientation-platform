# Scoring & Recommendation Sequence

This document describes how scoring engines produce results and recommendations.

---

## ML Scoring Flow

![Screenshot 2025-12-19 at 13.05.30.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_0dUO5T/Screenshot%202025-12-19%20at%2013.05.30.png)

## LLM Scoring Flow

![Screenshot 2025-12-19 at 13.06.37.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_VdWaaE/Screenshot%202025-12-19%20at%2013.06.37.png)

## Design Considerations

- Scoring engines are pluggable
- External services are isolated
- Results are persisted for auditability