# Scoring & Recommendation Sequence

This document describes how scoring engines produce results and recommendations.

---

## ML Scoring Flow

![sequence-scoring.png](../../assets/sequence-scoring.png)

## LLM Scoring Flow

![llm-scoring-flow.png](../../assets/llm-scoring-flow.png)

## Design Considerations

- Scoring engines are pluggable
- External services are isolated
- Results are persisted for auditability