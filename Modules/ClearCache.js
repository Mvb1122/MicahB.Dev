const keys = Object.keys(File_Cache);
keys.forEach(key => delete File_Cache[key]);

res.statusCode = 200;
res.setHeader("Content-Type", getMime("json"));
res.end(JSON.stringify({
    sucessful: true,
    cleared_files: keys
}));