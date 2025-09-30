# Test Checklist - Pengeluaranqu App

## Authentication Tests

- [ ] Login with email/password
- [ ] Register new account
- [ ] Login as guest
- [ ] Login with Google (simulation)
- [ ] Logout functionality
- [ ] Auth persistence (refresh page)

## Navigation Tests

- [ ] Bottom navigation works
- [ ] Dashboard tab
- [ ] Add Transaction tab
- [ ] History tab
- [ ] Active state visual feedback

## Transaction Tests

- [ ] Add expense transaction
- [ ] Add income transaction
- [ ] Transaction type switching (expense/income)
- [ ] Category selection populated
- [ ] Amount validation
- [ ] Date/time defaults
- [ ] Form validation (required fields)
- [ ] Success message after adding
- [ ] Return to dashboard after adding

## Dashboard Features

- [ ] Balance calculation (income - expense)
- [ ] Monthly income/expense display
- [ ] Category chart display
- [ ] Recent transactions list
- [ ] Floating action button (quick add)

## History Features

- [ ] Transaction list display
- [ ] Filter by month
- [ ] Filter by type (income/expense)
- [ ] Filter by category
- [ ] Clear filters
- [ ] Edit transaction
- [ ] Delete transaction

## Budget Features

- [ ] Set monthly budget
- [ ] Budget status display
- [ ] Budget warnings (80% and 100%)
- [ ] Budget integration in dashboard

## Data Persistence

- [ ] Data saves after adding transaction
- [ ] Data persists after page refresh
- [ ] User-specific data isolation
- [ ] Guest data handling

## UI/UX Features

- [ ] Toast notifications
- [ ] Loading states
- [ ] Form validation feedback
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Smooth animations
- [ ] Accessibility (keyboard navigation)

## Error Handling

- [ ] Network error handling
- [ ] Form validation errors
- [ ] Data corruption recovery
- [ ] Empty state handling

## Performance

- [ ] Fast initial load
- [ ] Smooth navigation
- [ ] No memory leaks
- [ ] Efficient data operations
