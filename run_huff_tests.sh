#!/bin/bash

for file in $(find ./src -type f -name '*.huff'); do
    echo "Testing $file..."
    output=$(huffc "$file" test 2>&1)
    echo "$output"

    # Check for the presence of [FAIL] that is not part of another word like [PASS]
    if echo "$output" | grep -E 'FAIL' > /dev/null; then
        echo "Failure detected in $file"
        exit 255
    else
        echo "Processed $file successfully"
    fi
done

echo "All tests completed"