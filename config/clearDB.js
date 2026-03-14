const mongoose = require('mongoose');
const mysql = require('./mysql');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 清空MongoDB数据库
const clearMongoDB = async () => {
  try {
    // 获取所有模型
    const models = Object.keys(mongoose.models);
    
    // 删除每个模型的数据
    for (const modelName of models) {
      const model = mongoose.models[modelName];
      await model.deleteMany({});
      console.log(`已清空MongoDB模型: ${modelName}`);
    }
    
    return { success: true, message: 'MongoDB数据库清空成功' };
  } catch (error) {
    console.error('清空MongoDB数据库失败:', error.message);
    return { success: false, message: '清空MongoDB数据库失败: ' + error.message };
  }
};

// 清空MySQL数据库
const clearMySQL = async () => {
  try {
    // 获取MySQL连接
    const connection = await mysql.getConnection();
    
    // 获取所有表名
    const [tables] = await connection.execute(
      "SHOW TABLES"
    );
    
    // 构建删除所有表的SQL语句
    const tableNames = tables.map(row => Object.values(row)[0]);
    if (tableNames.length > 0) {
      // 先禁用外键约束
      await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
      
      // 删除所有表
      for (const tableName of tableNames) {
        await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`已删除MySQL表: ${tableName}`);
      }
      
      // 重新启用外键约束
      await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    }
    
    // 释放连接
    connection.release();
    
    return { success: true, message: 'MySQL数据库清空成功' };
  } catch (error) {
    console.error('清空MySQL数据库失败:', error.message);
    return { success: false, message: '清空MySQL数据库失败: ' + error.message };
  }
};

// 清空所有数据库
const clearAllDatabases = async () => {
  console.log('开始清空数据库...');
  
  const mongoResult = await clearMongoDB();
  const mysqlResult = await clearMySQL();
  
  if (mongoResult.success && mysqlResult.success) {
    console.log('所有数据库清空成功');
    return { success: true, message: '所有数据库清空成功' };
  } else {
    console.log('数据库清空失败');
    return { 
      success: false, 
      message: `MongoDB: ${mongoResult.message}, MySQL: ${mysqlResult.message}` 
    };
  }
};

module.exports = { clearAllDatabases, clearMongoDB, clearMySQL };