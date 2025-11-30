<?php
// Suppress warnings in output, but log them
ini_set('display_errors', 0); // Disable error display
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log'); // Log errors to file

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
        echo json_encode(['error' => 'No wallet address provided']);
        $mysqli->close();
        exit;
    }

    $current_period = date('Y-m'); // e.g., '2025-08'
    $last_period = date('Y-m', strtotime('-1 month')); // e.g., '2025-07'

    log_message("Wallet: $wallet, Current Period: $current_period, Last Period: $last_period");

    // Check snapshot eligibility
    $elig_query = "SELECT nft_amount, snapshot_datetime FROM snapshots WHERE wallet_address = '$wallet' AND period = '$current_period'";
    log_message("Eligibility Query: $elig_query");
    $elig_result = $mysqli->query($elig_query);

    if ($mysqli->error) {
        log_message("Query Error: " . $mysqli->error);
        echo json_encode(['error' => 'Database error: ' . $mysqli->error]);
        $mysqli->close();
        exit;
    }

    $eligible = $elig_result->num_rows > 0;
    $nft_amount = 0;
    $snapshot_datetime = '';

    if ($eligible) {
        $row = $elig_result->fetch_assoc();
        $nft_amount = $row['nft_amount'];
        $snapshot_datetime = $row['snapshot_datetime'];
        log_message("Eligible Wallet Found: NFTs: $nft_amount, Snapshot: $snapshot_datetime");
    } else {
        $check_wallet_query = "SELECT period, nft_amount, snapshot_datetime FROM snapshots WHERE wallet_address = '$wallet'";
        log_message("Check Wallet Query: $check_wallet_query");
        $check_wallet_result = $mysqli->query($check_wallet_query);
        $wallet_periods = [];
        while ($row = $check_wallet_result->fetch_assoc()) {
            $wallet_periods[] = $row;
        }
        log_message("Wallet Periods Found: " . json_encode($wallet_periods));
    }

    // Check if checked in
    $check_query = "SELECT * FROM check_ins WHERE wallet_address = '$wallet' AND period = '$current_period'";
    log_message("Check-in Query: $check_query");
    $check_result = $mysqli->query($check_query);
    $checked_in = $check_result->num_rows > 0;

    // Last month airdrop
    $last_query = "SELECT amount FROM airdrops WHERE wallet_address = '$wallet' AND period = '$last_period'";
    log_message("Last Airdrop Query: $last_query");
    $last_result = $mysqli->query($last_query);
    $last_amount = ($last_result->num_rows > 0) ? $last_result->fetch_assoc()['amount'] : 0;

    // Total airdrop
    $total_query = "SELECT SUM(amount) AS total FROM airdrops WHERE wallet_address = '$wallet'";
    log_message("Total Airdrop Query: $total_query");
    $total_result = $mysqli->query($total_query);
    $total_amount = $total_result->fetch_assoc()['total'] ?? 0;

    $response = [
        'eligible' => $eligible,
        'checked_in' => $checked_in,
        'nft_amount' => $nft_amount,
        'snapshot_datetime' => $snapshot_datetime,
        'last_month' => $last_amount,
        'total' => $total_amount,
        'debug' => [
            'wallet' => $wallet,
            'current_period' => $current_period,
            'rows_found' => $elig_result->num_rows,
            'wallet_periods' => $wallet_periods
        ]
    ];

    log_message("Response: " . json_encode($response));
    echo json_encode($response);
} catch (Exception $e) {
    log_message("Exception: " . $e->getMessage());
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

$mysqli->close();
?>