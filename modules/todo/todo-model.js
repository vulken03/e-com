const db = require("../../database");
const user = db.user;
const Task = db.task;
const { Op } = require("sequelize");
//const excel = require('exceljs')

const task = async (userid, taskDetails) => {
  try {
    const todayDate = new Date();
    const date1 = new Date(taskDetails.start_date);
    const date2 = new Date(taskDetails.end_date);
    if (date1 < date2 && date1 >= todayDate) {
      await Task.create({
        task_name: taskDetails.task_name,
        start_date: taskDetails.start_date,
        end_date: taskDetails.end_date,
        user_id: userid,
      });
      return true;
    } else {
      const error = new Error(
        "enddate must be later timestamp than startdate or startdate greater than current date"
      );
      throw error;
    }
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

const update_task = async (userid, taskDetails, taskid) => {
  try {
    const todayDate = new Date();
    const date1 = new Date(taskDetails.start_date);
    const date2 = new Date(taskDetails.end_date);
    const taskData = await Task.findOne({
      where: {
        task_id: taskid,
      },
    });
    if (taskData) {
      if (taskData.user_id == userid && date1 < date2 && date1 >= todayDate) {
        await Task.update(taskDetails, {
          where: {
            task_id: taskid,
            user_id: userid,
          },
        });
        return true;
      } else {
        const error = new Error(
          "enddate must be later timestamp than startdate or startdate greater than current date"
        );
        throw error;
      }
    } else {
      const err = new Error("task not found with this id");
      throw err;
    }
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

const complete_task = async (userid, taskDetails, taskid) => {
  try {
    const taskData = await Task.findOne({
      where: {
        task_id: taskid,
      },
    });
    if (taskData) {
      if (taskData.user_id == userid) {
        await Task.update(taskDetails, {
          where: {
            task_id: taskid,
            user_id: userid,
          },
        });
        return true;
      }
    } else {
      const err = new Error("task notFound with this taskid");
      throw err;
    }
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

const delete_task = async (userid, taskid) => {
  try {
    const taskData = await Task.findOne({
      where: {
        task_id: taskid,
      },
    });

    console.log("taskdata", taskData);
    if (taskData) {
      if (taskData.user_id == userid && taskData.is_complete == false) {
        await Task.destroy({
          where: {
            task_id: taskid,
          },
        });
      } else {
        const err = new Error("task is completed");
        throw err;
      }
    }
  } catch (err) {
    console.log("error");
    throw err;
  }
};

const getTask = async (startDate, endDate, userid) => {
  try {
    const getTaskDetails = await Task.findAll({
      where: {
        user_id: userid,
        [Op.or]: {
          start_date: { [Op.between]: [startDate, endDate] },
          end_date: { [Op.between]: [startDate, endDate] },
        },
      },
      attributes: {
        include: ["task_name", "is_complete", "start_date", "end_date"],
      },

      include: {
        model: user,
        attributes: ["username"],
      },
      raw: true,
    });

    if (getTaskDetails) {
      console.log("user", getTaskDetails);
      return getTaskDetails;
    } else {
      const err = new Error("Error while getting data");
      throw err;
    }
  } catch (err) {
    console.log("err", err);
    throw error;
  }
};

module.exports = {
  task,
  complete_task,
  update_task,
  delete_task,
  getTask,
};
