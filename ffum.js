#!/usr/bin/env node

var childProcess = require('child_process'),
    http = require('http');

function getMirrorsList(callbackFn, errorFn) {
    var url = 'http://mirrors.ubuntu.com/mirrors.txt';

    http.get(url).on('response', function (response) {
        var content = '';

        response.on('data', function (chunk) {
            content += chunk;
        });

        response.on('end', function () {
            callbackFn(content.split(/\r?\n/));
        });
    }).on('error', function (error) {
        errorFn(error);
    });
}

function sortByAverageResponseTime(mirrors, callbackFn) {
    var servers = [];

    function getAverageResponseTime(mirror) {
        var hostname = mirror.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i)[1],
            command = "ping -c 5 " + hostname + " | tail -1 | awk -F '/' '{print $5}'";

        childProcess.exec(command, function (error, stdout, stderr) {
            servers.push({
                mirror: mirror,
                time: Math.round(+stdout.trim())
            });

            if (servers.length === mirrors.length) {
                servers.sort(function (a, b) {
                    return a.time - b.time;
                });

                callbackFn(servers);
            }
        });
    }

    for (var i in mirrors) {
        getAverageResponseTime(mirrors[i]);
    }
}

console.log('Downloading mirrors list...');
getMirrorsList(function (mirrors) {
    console.log('Testing download servers...');
    sortByAverageResponseTime(mirrors, function (servers) {
        console.log('Winner: ' + servers[0].mirror);
    });
}, function (error) {
    console.log('Connection error');
});
