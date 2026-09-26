import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from '../DataTable';

type TestData = {
  id: string;
  name: string;
  role: string;
  status: string;
};

const mockColumns: Column<TestData>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status' },
];

const mockData: TestData[] = [
  { id: '1', name: 'Alice', role: 'Instructor', status: 'Active' },
  { id: '2', name: 'Bob', role: 'Student', status: 'Inactive' },
];

describe('DataTable Component (Issue #181)', () => {
  it('renders table headers and data rows correctly', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders skeleton rows when isLoading is true', () => {
    const { container } = render(
      <DataTable columns={mockColumns} data={[]} isLoading={true} />
    );

    // 5 skeleton rows
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });

  it('renders empty state when data is empty and not loading', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyMessage="No students found"
        emptyCta={<button>Add Student</button>}
      />
    );

    expect(screen.getByText('No students found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Student' })).toBeInTheDocument();
  });

  it('calls onSort when a sortable column header is clicked', () => {
    const onSortMock = vi.fn();
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        onSort={onSortMock}
        sortColumn="name"
        sortDirection="asc"
      />
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    expect(onSortMock).toHaveBeenCalledWith('name');
  });
});
