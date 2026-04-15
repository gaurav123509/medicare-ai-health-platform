const bcrypt = require('bcryptjs');
const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class User extends CompatibleModel {
  static get hiddenFields() {
    return ['password'];
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.getDataValue('password'));
  }
}

User.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      allowNull: false,
      defaultValue: createObjectId,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 255],
          msg: 'Name must be at least 2 characters long',
        },
      },
      set(value) {
        this.setDataValue('name', String(value || '').trim());
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('email', String(value || '').trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      set(value) {
        this.setDataValue('phone', String(value || '').trim());
      },
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120,
      },
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: false,
      defaultValue: 'prefer_not_to_say',
    },
    bloodGroup: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      set(value) {
        this.setDataValue('bloodGroup', String(value || '').trim());
      },
    },
    role: {
      type: DataTypes.ENUM('patient', 'doctor', 'admin'),
      allowNull: false,
      defaultValue: 'patient',
    },
    emergencyContact: jsonField('emergencyContact', {
      name: '',
      phone: '',
      relation: '',
    }),
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.setDataValue('password', await bcrypt.hash(user.getDataValue('password'), 12));
        }
      },
    },
  },
);

module.exports = User;
