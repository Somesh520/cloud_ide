const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

function runCommand(command) {
    console.log(`Executing: ${command}`);
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) console.error(`Command error: ${error.message}`);
            if (stderr) console.error(`Command stderr: ${stderr}`);
            resolve({ error, stdout, stderr });
        });
    });
}

async function executeCpp(code, testCases) {
    const id = crypto.randomUUID();
    const folderPath = path.join(TEMP_DIR, id);
    fs.mkdirSync(folderPath);

    const codeFilePath = path.join(folderPath, 'solution.cpp');
    const testRunnerPath = path.join(folderPath, 'test_runner.cpp');

    // User's function code
    fs.writeFileSync(codeFilePath, code);

    // Generate test runner
    // We assume the user provides a function with a specific signature or just the function definition.
    // For simplicity, let's assume they provide the function and we call it in main.
    let testRunnerContent = `
#include <iostream>
#include <string>
#include <vector>
#include "solution.cpp"

int main() {
`;

    testCases.forEach((tc, index) => {
        // tc.input should be a string that can be piped to the program or used here.
        // For C++, we'll use a simple approach where we inject input directly or use cin.
        // Here, we'll assume the user function is what we test.
        // BUT, a better way for "competitive coding" style is to run the whole program and pipe input.
        // Let's go with the pipe approach for maximum flexibility.
    });

    // Actually, let's just make the user provide a full program OR we wrap it.
    // Let's assume the user provides the whole program for Step 1.

    // Cleanup will be needed.

    // For now, let's just try to compile and run.
    const dockerCommand = `docker run --rm -v ${folderPath}:/app -w /app gcc:latest bash -c "g++ solution.cpp -o solution && ./solution"`;

    // This needs careful handling of test cases.
    // Let's refine the "test case" logic: Pipe each input to the compiled binary.

    const results = [];

    // Compilation Step - Direct g++ execution
    const compileResult = await runCommand(`g++ ${codeFilePath} -o ${path.join(folderPath, 'solution')}`);

    if (compileResult.error || compileResult.stderr) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        return {
            success: false,
            error: 'Compilation Error',
            details: compileResult.stderr || (compileResult.error ? compileResult.error.message : 'Unknown compilation error')
        };
    }
    console.log('Compilation successful.');

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        console.log(`Running Test Case ${i + 1} with input: "${tc.input}"`);

        // Run binary directly with timeout (2 seconds)
        const runResult = await new Promise((resolve) => {
            const child = exec(`${path.join(folderPath, 'solution')}`, { timeout: 2000 }, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr });
            });
            child.stdin.write(tc.input);
            child.stdin.end();
        });

        const output = runResult.stdout ? runResult.stdout.trim() : '';
        const successful = output === tc.output.trim();

        console.log(`Test Case ${i + 1}: ${successful ? 'SUCCESSFUL' : 'FAILED'}`);

        results.push({
            id: i + 1,
            input: tc.input,
            expected: tc.output,
            actual: output,
            passed: successful,
            error: runResult.error && runResult.error.signal === 'SIGTERM' ? 'Execution Timeout (Infinite loop?)' : runResult.stderr
        });
    }

    // Cleanup
    fs.rmSync(folderPath, { recursive: true, force: true });

    return {
        success: true,
        results: results
    };
}

module.exports = { executeCpp };
