import { GET_NOTIFICATION, CLEAR_NOTIFICATION } from "../constants/action";

export default (notification = {}, action) => {
  switch (action.type) {
    case GET_NOTIFICATION:
      return action.payload;
    case CLEAR_NOTIFICATION:
      return {};
    default:
      return notification;
  }
};
