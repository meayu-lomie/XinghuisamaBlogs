"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义操作的类型
// 操作类型：必须覆盖全仓实际提交的所有 type 值，
// 否则 Navbar 分发时会走 default 分支（操作静默失效）。
// - publish_article : 文章 / 杂谈 / 关于页
// - create_moment   : 说说
// - sync_photowall  : 照片墙（相册）
// - sync_projects   : 项目
// - CONFIG          : 站点配置
export type OperationType =
  | 'publish_article'
  | 'create_moment'
  | 'sync_photowall'
  | 'sync_projects'
  | 'POST'
  | 'CHATTER'
  | 'CONFIG'
  | 'GALLERY';

export interface Operation {
  id: string;
  type: OperationType;
  label: string;      // 显示在列表里的简短描述，如 "修改杂谈：某篇标题"
  description?: string; // 详细描述（可选，多数调用方省略）
  timestamp: string;
  payload?: any;      // 实际要修改的数据内容
  value?: any;        // 部分操作（照片墙 / 项目）用它携带全量数组
  key?: string;       // 设置类操作：被改的字段名
}

interface OperationContextType {
  operations: Operation[];
  // id / timestamp 由 Provider 自动生成；调用方传的会被忽略（保留兼容）
  addOperation: (op: Omit<Operation, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

export function OperationProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);

  // 添加操作（如果同类型的操作已存在，则覆盖，防止重复积攒）
  const addOperation = (op: Omit<Operation, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
    const newOp: Operation = {
      ...op,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOperations(prev => {
      // 如果是修改同一个文件，先过滤掉旧的，再加新的
      const filtered = prev.filter(item => !(item.type === op.type && item.label === op.label));
      return [...filtered, newOp];
    });
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const clearOperations = () => setOperations([]);

  return (
    <OperationContext.Provider value={{ operations, addOperation, removeOperation, clearOperations }}>
      {children}
    </OperationContext.Provider>
  );
}

// 导出 Hook 方便其他组件调用
export const useOperations = () => {
  const context = useContext(OperationContext);
  if (!context) throw new Error("useOperations must be used within an OperationProvider");
  return context;
};