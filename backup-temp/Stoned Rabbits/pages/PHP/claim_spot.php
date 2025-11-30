<?php
// Suppress warnings in output, but log them
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

header('Content-Type: application/json');

include 'db_connect.php';

// Log to a file for debugging
$log_file = __DIR__ . '/debug.log';
function log_message($message) {
    global $log_file;
    file_put_contents($log_file, date('Y-m-d H:i:s') . " - $message\n", FILE_APPEND);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $wallet = isset($data['wallet']) ? $mysqli->real_escape_string(trim($data['wallet'])) : '';

    if (empty($wallet)) {
        log_message("Error: No wallet address provided");
        echo json_encode(['success' => false, 'message' => 'No wallet address provided']);
        $mysqli->close();
        exit;
    }

    $current_period = date('Y-m'); // e.g., '2025-08'
    log_message("Claim Spot: Wallet: $wallet, Current Period: $current_period");

    // Check if wallet is eligible
    $elig_query = "SELECT nft_amount FROM snapshots WHERE wallet_address = '$wallet' AND period = '$current_period'";
    log_message("Eligibility Query: $elig_query");
    $elig_result = $mysqli->query($elig_query);

    if ($mysqli->error) {
        log_message("Eligibility Query Error: " . $mysqli->error);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $mysqli->error]);
        $mysqli->close();
        exit;
    }

    if ($elig_result->num_rows === 0) {
        log_message("Wallet $wallet not eligible for period $current_period");
        echo json_encode(['success' => false, 'message' => 'Wallet not eligible for this month']);
        $mysqli->close();
        exit;
    }

    $row = $elig_result->fetch_assoc();
    $nft_amount = $row['nft_amount'];

    // Check if already checked in
    $check_query = "SELECT * FROM check_ins WHERE wallet_address = '$wallet' AND period = '$current_period'";
    log_message("Check-in Query: $check_query");
    $check_result = $mysqli->query($check_query);

    if ($mysqli->error) {
        log_message("Check-in Query Error: " . $mysqli->error);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $mysqli->error]);
        $mysqli->close();
        exit;
    }

    if ($check_result->num_rows > 0) {
        log_message("Wallet $wallet already checked in for $current_period");
        echo json_encode(['success' => false, 'message' => 'Already checked in for this month']);
        $mysqli->close();
        exit;
    }

    // Insert check-in record
    $insert_query = "INSERT INTO check_ins (wallet_address, period, check_in_datetime) VALUES ('$wallet', '$current_period', NOW())";
    log_message("Insert Check-in Query: $insert_query");
    $insert_result = $mysqli->query($insert_query);

    if ($mysqli->error) {
        log_message("Insert Check-in Error: " . $mysqli->error);
        echo json_encode(['success' => false, 'message' => 'Failed to check in: ' . $mysqli->error]);
        $mysqli->close();
        exit;
    }

    log_message("Wallet $wallet successfully checked in for $current_period");
    echo json_encode(['success' => true, 'message' => 'Successfully checked in']);

    $mysqli->close();
} catch (Exception $e) {
    log_message("Exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>