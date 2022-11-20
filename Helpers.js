async function postJSON(URL, data) {
    return request = fetch(URL, {
        method: "POST",
        body: typeof data == String ? data : JSON.stringify(data)
    }).then((res) => res.json());
}