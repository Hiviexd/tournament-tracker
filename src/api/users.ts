import axios from 'axios';
import helpers from '../helpers';

export const getLoggedInUser = async () => {
    const response = await axios.get('/api/users/me');
    return helpers.httpIsValid(response.data) ? response.data : null;
};
