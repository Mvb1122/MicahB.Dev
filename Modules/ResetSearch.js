res.setHeader("Content-Type", getMime("json"));
BuildGlobalPaths().then(() => {
    res.end(JSON.stringify({
        sucessful: true,
    }));
})