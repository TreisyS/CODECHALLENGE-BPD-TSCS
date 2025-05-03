import axios from 'axios';
import { GetProfileQuery } from '../dtos/get-profile.dto';
import { IPerson } from '../models/person.model'
import { config } from '../config';


const MS2_BASE_URL = config.BASE_URL_MS2;
const SERVICE_SECRET_KEY = config.API_KEY_SECRET || '';

export const getProfile = async (query: GetProfileQuery) => {
  const response = await axios.get<{ data: IPerson[] }>(`${MS2_BASE_URL}/api/v1/internal/profiles`, {
    headers: {
      'mservice-key': SERVICE_SECRET_KEY,
    },
    params: query,
  });

  return response.data;
};

export const getProfileById = async (id: string): Promise<IPerson> => {
  const response = await axios.get<IPerson>(`${MS2_BASE_URL}/api/v1/internal/profiles/${id}`, {
    headers: {
      'mservice-key': SERVICE_SECRET_KEY,
    },
  });

  return response.data;
};
