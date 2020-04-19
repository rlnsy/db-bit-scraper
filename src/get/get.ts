import { AxiosResponse, AxiosError } from 'axios';
import {log, Levels} from '../logging/logging';

const axios = require('axios').default;

export async function getGlossaryContent(): Promise<string> {
    const url = process.env.DBBS_GLOSSARY_URL;
    if (!url) {
        throw new Error("Missing glossary URL in environment");
    } else {
        log(Levels.INFO, `Fetching from ${url}`);
        return axios.get(url)
            .then((res: AxiosResponse) => {
                return res.data;
            })
            .catch((err: AxiosError) => {
                throw new Error("Error making request");
            });
    }
}