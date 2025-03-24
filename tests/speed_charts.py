import json
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# Load benchmark results
with open("benchmark_results.json") as f:
    data = json.load(f)

# Extract names and execution times
names = [bench["name"] for bench in data["benchmarks"]]
times = [bench["stats"]["mean"] for bench in data["benchmarks"]]

# Plot results
plt.figure(figsize=(10, 5))
plt.barh(names, times, color='skyblue')
plt.xlabel("Execution Time (seconds)")
plt.ylabel("Test Cases")
plt.title("Benchmark Performance Comparison")
plt.gca().invert_yaxis()  # Flip y-axis for readability
plt.show()