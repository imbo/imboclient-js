<?php
namespace Imbo;

return array(
    'auth' => array(
        'test' => 'test',
    ),

    'database' => function() {
        return new Database\MongoDB(array(
            'databaseName' => 'imbo-develop',
        ));
    },

    'storage' => function() {
        return new Storage\GridFS(array(
            'databaseName' => 'imbo-develop-storage',
        ));
    }
);
