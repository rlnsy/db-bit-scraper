/*
* Helper function created from referenced stackoverflow post: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
*/
export const genUUID = () => {
    return 'xxxxxxxxxxxxxx4xxxxyxxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
