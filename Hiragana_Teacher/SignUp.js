async function SignUp(username, password) {
    let data = {
        "username": username,
        "password": password
    }

    // Send this information to the server.
    let response = await postJSON(`${pageURL}/Post_Modules/RegisterUser.js&cache=false`, data);

    // Login, once registration is complete.
    response = await postJSON(`${pageURL}/Post_Modules/GetLoginToken.js&cache=false`, data);
    login_token = response.token;
    Login_Username = data.username;
    console.log(response);

    updateLoginPane(true);
    LeaveSignUp();
}