export class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
    this.page = parseInt(queryString.page, 10) || 1;
    this.limit = parseInt(queryString.limit, 10) || 10;
  }

  paginate() {
    const skip = (this.page - 1) * this.limit;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(this.limit);
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  select() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      const searchRegex = new RegExp(searchTerm, 'i');
      this.mongooseQuery = this.mongooseQuery.find({
        $or: [
          { displayName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ],
      });
    }
    return this;
  }
} 