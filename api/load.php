<?php
// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$dataDir = __DIR__ . '/../data';

// Determine file type based on request
$type = isset($_GET['type']) ? $_GET['type'] : 'flowsheet';

// Set filename based on type
if ($type === 'operations') {
    $filename = 'operations.json';
} elseif ($type === 'snippets') {
    $filename = 'snippets.json';
} else {
    $filename = 'flowsheet.json';
}

// Check if specific backup requested
if (isset($_GET['backup'])) {
    $backup = basename($_GET['backup']); // Sanitize
    $filename = $backup;
}

$filepath = $dataDir . '/' . $filename;

// Check if file exists
if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'No saved data found', 'exists' => false]);
    exit;
}

// Read and return the data
$data = file_get_contents($filepath);

if ($data === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read data']);
    exit;
}

// Return the raw JSON data
echo $data;
