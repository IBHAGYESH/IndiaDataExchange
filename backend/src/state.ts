let dbConnected = false;

export const setDbConnected = (status: boolean) => {
  dbConnected = status;
};

export const getDbConnected = () => dbConnected;
