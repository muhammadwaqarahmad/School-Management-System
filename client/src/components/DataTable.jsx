/**
 * DATA TABLE COMPONENT
 * ====================
 * Reusable table component for displaying data
 * - Responsive design
 * - Action buttons (Edit, Delete, Mark as Paid)
 * - Conditional rendering based on props
 */

import { formatCurrency } from '../utils/currencyFormatter';
import { formatDate } from '../utils/formatDate';

const DataTable = ({ columns, data, actions, emptyMessage = 'No data found' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[600px]" style={{ scrollBehavior: 'smooth' }}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                {columns.map((column, colIndex) => {
                  let value = row[column.key];
                  
                  // Format based on column type
                  if (column.type === 'currency') {
                    value = formatCurrency(value);
                  } else if (column.type === 'date') {
                    value = formatDate(value);
                  } else if (column.type === 'boolean') {
                    value = value ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Paid
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Unpaid
                      </span>
                    );
                  } else if (column.render) {
                    value = column.render(row);
                  }
                  
                  return (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {value || 'N/A'}
                    </td>
                  );
                })}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

