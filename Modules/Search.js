res.setHeader("Content-Type", getMime("json"));
if (args.term) {
    res.statusCode = 200;
    const term = args.term.trim('"').trim();
    res.end(JSON.stringify({
        sucessful: true,
        term: term,
        result: FindFile(args.term)
    }));
} else {
    res.statusCode = 404;
    res.end(JSON.stringify({
        sucessful: false,
        reason: "No term param specified."
    }));
}