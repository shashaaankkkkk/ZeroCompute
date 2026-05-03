# ZeroCompute

ZeroCompute is a distributed computing platform designed for invisible and adaptive resource management. It utilizes a microservices architecture to separate control, computation, and storage responsibilities.

## Project Structure

- **control-service**: Central node registry and discovery service.
- **worker-node**: Distributed computation engine for offloading tasks.
- **storage-node**: Networked file management and persistence service.
- **primary-agent**: Intelligent orchestrator and decision engine.
- **documentation**: Detailed architectural and technical guides.
- **shared**: Common schemas and utility modules.

## Getting Started

### Prerequisites
- Python 3.10+
- tmux (for multi-pane orchestration)

### Installation
1. Clone the repository.
2. Install dependencies for all services:
   ```bash
   pip install -r requirements.txt
   ```

### Running the System
The system is designed to run in a multi-pane tmux environment for easy monitoring.
```bash
./run-all.sh
```

## Documentation
For a detailed breakdown of the system architecture, interaction flows, and component responsibilities, please refer to the [Architecture Documentation](documentation/architecture.md).

## License
MIT
