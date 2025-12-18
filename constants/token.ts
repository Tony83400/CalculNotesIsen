const cookieName = "token";
export function getToken() {
    return localStorage.getItem(cookieName);
}
export function setToken(value: string) {
    return localStorage.setItem(cookieName, value);
}
