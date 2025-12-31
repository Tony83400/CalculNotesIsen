const cookieName = "token";
export function getToken() {
    return localStorage.getItem(cookieName);
}
export function setToken(value: string) {
    return localStorage.setItem(cookieName, value);
}

const userName = "user"
export function getId() {
    return localStorage.getItem(userName);
}
export function setId(value: string) {
    return localStorage.setItem(userName, value);
}