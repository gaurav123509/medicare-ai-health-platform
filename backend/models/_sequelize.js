const crypto = require('crypto');
const db = require('../config/db');

const { sequelize, Sequelize } = db;
const { DataTypes, Model } = Sequelize;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const createObjectId = () => crypto.randomBytes(12).toString('hex');

const normalizeWhere = (filter = {}) => {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined),
  );
};

const buildOrder = (sort = null) => {
  if (!sort || typeof sort !== 'object' || Array.isArray(sort)) {
    return undefined;
  }

  return Object.entries(sort).map(([field, direction]) => [
    field,
    Number(direction) === -1 ? 'DESC' : 'ASC',
  ]);
};

const buildAttributes = (ModelClass, selection = null) => {
  const hiddenFields = new Set(ModelClass.hiddenFields || []);

  if (typeof selection === 'string' && selection.trim()) {
    const tokens = selection.trim().split(/\s+/);

    for (const token of tokens) {
      if (token.startsWith('+')) {
        hiddenFields.delete(token.slice(1));
      } else if (token.startsWith('-')) {
        hiddenFields.add(token.slice(1));
      }
    }
  }

  if (hiddenFields.size === 0) {
    return undefined;
  }

  return {
    exclude: [...hiddenFields],
  };
};

class QueryAdapter {
  constructor(executor) {
    this.executor = executor;
    this.selection = null;
    this.sorting = null;
    this.promise = null;
  }

  select(selection) {
    this.selection = selection;
    this.promise = null;
    return this;
  }

  sort(sorting) {
    this.sorting = sorting;
    this.promise = null;
    return this;
  }

  exec() {
    if (!this.promise) {
      this.promise = this.executor({
        selection: this.selection,
        sorting: this.sorting,
      });
    }

    return this.promise;
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }

  finally(onFinally) {
    return this.exec().finally(onFinally);
  }
}

class CompatibleModel extends Model {
  static get hiddenFields() {
    return [];
  }

  static buildQueryOptions(filter = {}, selection = null, sorting = null) {
    const attributes = buildAttributes(this, selection);
    const order = buildOrder(sorting);
    const options = {
      where: normalizeWhere(filter),
    };

    if (attributes) {
      options.attributes = attributes;
    }

    if (order && order.length > 0) {
      options.order = order;
    }

    return options;
  }

  static find(filter = {}) {
    return new QueryAdapter(async ({ selection, sorting }) => {
      const options = this.buildQueryOptions(filter, selection, sorting);
      return Model.findAll.call(this, options);
    });
  }

  static findOne(filter = {}) {
    return new QueryAdapter(async ({ selection, sorting }) => {
      const options = this.buildQueryOptions(filter, selection, sorting);
      return Model.findOne.call(this, options);
    });
  }

  static findById(id) {
    return new QueryAdapter(async ({ selection, sorting }) => {
      const options = this.buildQueryOptions({ _id: id }, selection, sorting);
      return Model.findOne.call(this, options);
    });
  }

  static async findOneAndDelete(filter = {}) {
    const record = await Model.findOne.call(this, {
      where: normalizeWhere(filter),
    });

    if (!record) {
      return null;
    }

    await record.destroy();
    return record;
  }

  toJSON() {
    const values = { ...this.get({ plain: true }) };

    for (const field of this.constructor.hiddenFields || []) {
      delete values[field];
    }

    return values;
  }
}

const jsonField = (fieldName, defaultValue, options = {}) => ({
  type: DataTypes.TEXT,
  allowNull: options.allowNull ?? false,
  defaultValue: JSON.stringify(defaultValue),
  get() {
    const rawValue = this.getDataValue(fieldName);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return cloneValue(defaultValue);
    }

    if (typeof rawValue !== 'string') {
      return rawValue;
    }

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return cloneValue(defaultValue);
    }
  },
  set(value) {
    const normalized = value === undefined
      ? cloneValue(defaultValue)
      : value;

    this.setDataValue(fieldName, JSON.stringify(normalized));
  },
});

module.exports = {
  CompatibleModel,
  DataTypes,
  QueryAdapter,
  Sequelize,
  createObjectId,
  jsonField,
  sequelize,
};
