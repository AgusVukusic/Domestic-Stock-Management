import React, { createContext, useContext, useState, useEffect } from 'react';
import { groupsAPI } from '../services/api';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, []);

  const loadGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      setGroups(res.data);
      
      const savedGroup = localStorage.getItem('lastActiveGroup');
      if (savedGroup && res.data.some(g => g._id === savedGroup)) {
        setActiveGroup(savedGroup);
      } else if (res.data.length > 0) {
        setActiveGroup(res.data[0]._id);
        localStorage.setItem('lastActiveGroup', res.data[0]._id);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeActiveGroup = (groupId) => {
    setActiveGroup(groupId);
    localStorage.setItem('lastActiveGroup', groupId);
  };

  const refreshGroups = () => {
    loadGroups();
  };

  return (
    <GroupContext.Provider value={{ groups, activeGroup, changeActiveGroup, loading, refreshGroups }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
};
