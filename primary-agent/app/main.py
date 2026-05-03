from app.core.orchestrator import run_task, get_file

if __name__ == "__main__":
    print("Compute Test:")
    print(run_task("hello"))
    print(run_task("HELLO WORLD"))

    print("\nFile Test:")
    print(get_file("some-file-id"))
