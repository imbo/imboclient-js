<?php
namespace Imbo;

return array(
    'auth' => array(
        'test' => 'test',
    ),

    'database' => function() {
        return new Database\MongoDB(array(
            'databaseName' => 'imbo-033',
        ));
    },

    'storage' => function() {
        return new Storage\GridFS(array(
            'databaseName' => 'imbo-033-storage',
        ));
    }
);
