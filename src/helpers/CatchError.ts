const CatchError = (error: any) => {
  const err = error.response
    ? error.response.data.error
    : error.message || "Something went wrong";
  return err;
};

export default CatchError;
