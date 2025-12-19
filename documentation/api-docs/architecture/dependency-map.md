# Dependency Map

![Screenshot 2025-12-19 at 13.18.19.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_TaoOSs/Screenshot%202025-12-19%20at%2013.18.19.png)

The dependency map illustrates a layered dependency structure where higher-level modules depend only on lower-level abstractions.

The API layer depends on application services and DTOs, while business logic depends on domain entities and repository interfaces.

External integrations (ML, LLM, Email) are isolated behind dedicated services and factories, preventing direct coupling between controllers and infrastructure concerns.