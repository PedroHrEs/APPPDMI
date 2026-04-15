import axios from "axios";

import { JSONBinResponse } from "../types/Product";

import { API_KEY, URL } from "../constants/config";

export const getProduct = async () => {
  const response = await axios.get<JSONBinResponse>(URL, {
    headers: {
      "X-Master-Key": API_KEY,
    },
  });

  return response.data.record;
};
