const ClassMeeting = sequelize.define("ClassMeeting", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  className: { type: DataTypes.STRING, allowNull: false },
  meetingId: { type: DataTypes.STRING, allowNull: true }, 
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id"
    },
    onDelete: "CASCADE",
  },
  classUrl: { type: DataTypes.STRING, allowNull: true },
  teacherName: { type: DataTypes.STRING, allowNull: true },
  slug: { type: DataTypes.STRING, allowNull: true, unique: true },
});
