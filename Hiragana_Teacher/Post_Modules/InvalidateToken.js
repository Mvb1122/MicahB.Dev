// Use sent user information to run the InvalidateToken() function in the index.js file.
let token = JSON.parse(data).token;

InvalidateToken(token);

let response = {
    sucessful: true
}

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
return res.end(JSON.stringify(response));