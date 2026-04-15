const { spawn } = require('child_process');
const path = require('path');

/**
 * Communicates with Python scripts in src/utils
 * @param {string} scriptName - Name of the python script (e.g. 'preprocessor.py')
 * @param {object} inputData - JSON data to send to the script via stdin
 * @returns {Promise<object>} - Response from the python script
 */
const runPythonScript = (scriptName, inputData) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const pythonProcess = spawn('python', [scriptPath]);

    let output = '';
    let errorOutput = '';

    // Send data to stdin
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script ${scriptName} exited with code ${code}. Error: ${errorOutput}`));
      }
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });
  });
};

module.exports = { runPythonScript };
