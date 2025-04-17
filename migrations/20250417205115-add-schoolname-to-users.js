export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Users", "schoolName", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Users", "schoolName");
}
