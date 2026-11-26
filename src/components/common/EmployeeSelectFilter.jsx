import React, { useState, useRef, useEffect } from 'react';
import { User, Search, X, ChevronDown } from 'lucide-react';

const EmployeeSelectFilter = ({
  employees = [],
  selectedEmployeeId = '',
  onChange,
  placeholder = 'All Employees',
  label = 'Filter by Employee'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEmployee = employees.find(e => e._id === selectedEmployeeId);

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const dept = (emp.departmentName || '').toLowerCase();
    return fullName.includes(q) || code.includes(q) || dept.includes(q);
  });

  const handleSelect = (empId) => {
    onChange(empId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 220 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          border: selectedEmployeeId ? '1px solid #2563EB' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: 13,
          minHeight: 38,
          boxShadow: selectedEmployeeId ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none',
          transition: 'border-color 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <User size={15} color={selectedEmployeeId ? '#2563EB' : 'var(--text-muted)'} />
          <span style={{ 
            color: selectedEmployee ? 'var(--primary-navy)' : 'var(--text-muted)',
            fontWeight: selectedEmployee ? 600 : 400,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            {selectedEmployee 
              ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.employeeCode || 'Emp'})`
              : placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {selectedEmployeeId && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear employee filter"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} color="var(--text-muted)" />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          maxHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search box inside dropdown */}
          <div style={{ padding: 8, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 12,
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Employee list */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 220 }}>
            {/* All Employees Option */}
            <div
              onClick={() => handleSelect('')}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                cursor: 'pointer',
                background: !selectedEmployeeId ? '#EFF6FF' : 'transparent',
                color: !selectedEmployeeId ? '#2563EB' : 'var(--text-primary)',
                fontWeight: !selectedEmployeeId ? 600 : 400,
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{placeholder} (Show All)</span>
              {!selectedEmployeeId && <span style={{ fontSize: 11, color: '#2563EB' }}>Active</span>}
            </div>

            {filteredEmployees.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                No employees matching "{searchTerm}"
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isSelected = emp._id === selectedEmployeeId;
                return (
                  <div
                    key={emp._id}
                    onClick={() => handleSelect(emp._id)}
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      cursor: 'pointer',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      color: isSelected ? '#2563EB' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 400,
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: isSelected ? 600 : 500 }}>
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                        {emp.employeeCode || 'N/A'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {emp.designation || emp.designationName || 'Employee'} • {emp.departmentName || 'General'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSelectFilter;
