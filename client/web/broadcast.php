<?php

$redis = new \Predis\Client();

$cmdSet = $redis->createCommand('PUBLISH');
$cmdSet->setArguments([
    'channel' => 'socket',
    'message' => json_encode([
        'action' => 'alert',
        'data' => ['message' => 'Hello Node.js Socket.js'],
        'users' => ['INSERT_USER_ID_HERE'],
    ]),
]);
$cmdSetReply = $redis->executeCommand($cmdSet);
