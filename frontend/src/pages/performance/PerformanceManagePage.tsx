import { useState, useEffect } from 'react';
import { Award, Target, Plus, Loader2, Filter } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import * as performanceApi from '../../api/performance.api';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  userId: string;
  period: string;
  year: number;
  selfRating: number | null;
  managerRating: number | null;
  overallRating: number | null;
  status: string;
  user?: { id: string; firstName: string; lastName: string; employeeId: string };
}

const PerformanceManagePage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  const [showInitCycle, setShowInitCycle] = useState(false);
  const [cycleData, setCycleData] = useState({ period: 'Q1', year: new Date().getFullYear() });
  const [reviewFilter, setReviewFilter] = useState({ period: '', status: '' });
  const [managerReview, setManagerReview] = useState<{
    reviewId: string;
    managerRating: number;
    managerComments: string;
    overallRating: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [reviewFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reviewsData, goalsData] = await Promise.all([
        performanceApi.getAllReviews({
          period: reviewFilter.period || undefined,
          status: reviewFilter.status || undefined,
        }),
        performanceApi.getAllGoals(),
      ]);
      setReviews(reviewsData);
      setGoals(goalsData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitCycle = async () => {
    try {
      await performanceApi.startReviewCycle({
        userIds: [],
        period: cycleData.period,
        year: cycleData.year,
      });
      toast.success('Review cycle initiated');
      setShowInitCycle(false);
      fetchData();
    } catch {
      toast.error('Failed to initiate cycle');
    }
  };

  const handleManagerReview = async () => {
    if (!managerReview) return;
    try {
      await performanceApi.submitManagerRating(managerReview.reviewId, {
        managerRating: managerReview.managerRating,
        managerComments: managerReview.managerComments,
      });
      toast.success('Manager review submitted');
      setManagerReview(null);
      fetchData();
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'MISSED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <PageHeader
        title="Performance Management"
        subtitle="Manage reviews and goals"
        actions={
          <button
            onClick={() => setShowInitCycle(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Initiate Review Cycle
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        {['reviews', 'goals'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab === 'reviews' ? 'Review Cycles' : 'Goals Overview'}
          </button>
        ))}
      </div>

      {showInitCycle && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Initiate Review Cycle</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Period</label>
              <select
                value={cycleData.period}
                onChange={(e) => setCycleData({ ...cycleData, period: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="Q1">Q1 (Jan-Mar)</option>
                <option value="Q2">Q2 (Apr-Jun)</option>
                <option value="Q3">Q3 (Jul-Sep)</option>
                <option value="Q4">Q4 (Oct-Dec)</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <input
                type="number"
                value={cycleData.year}
                onChange={(e) => setCycleData({ ...cycleData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowInitCycle(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
            <button onClick={handleInitCycle} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Initiate</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {activeTab === 'reviews' && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Filter size={16} className="text-gray-400" />
                <select value={reviewFilter.period} onChange={(e) => setReviewFilter({ ...reviewFilter, period: e.target.value })} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800">
                  <option value="">All Periods</option>
                  <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option><option value="ANNUAL">Annual</option>
                </select>
                <select value={reviewFilter.status} onChange={(e) => setReviewFilter({ ...reviewFilter, status: e.target.value })} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800">
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="COMPLETED">Completed</option>
                </select>
              </div>

              {reviews.length === 0 ? (
                <EmptyState title="No reviews" description="No review cycles found." icon={Award} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3">Employee</th>
                      <th className="text-left py-3">Period</th>
                      <th className="text-left py-3">Year</th>
                      <th className="text-left py-3">Self Rating</th>
                      <th className="text-left py-3">Manager Rating</th>
                      <th className="text-left py-3">Overall</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3">{r.user?.firstName} {r.user?.lastName}</td>
                        <td className="py-3">{r.period}</td>
                        <td className="py-3">{r.year}</td>
                        <td className="py-3">{r.selfRating || '-'}/5</td>
                        <td className="py-3">{r.managerRating || '-'}/5</td>
                        <td className="py-3">{r.overallRating || '-'}</td>
                        <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span></td>
                        <td className="py-3 text-right">
                          {r.status === 'SUBMITTED' && (
                            <button
                              onClick={() => setManagerReview({ reviewId: r.id, managerRating: 3, managerComments: '', overallRating: 3 })}
                              className="text-xs text-accent hover:underline"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              {goals.length === 0 ? (
                <EmptyState title="No goals" description="No goals found." icon={Target} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3">Employee</th>
                      <th className="text-left py-3">Goal</th>
                      <th className="text-left py-3">Weight</th>
                      <th className="text-left py-3">Target Date</th>
                      <th className="text-left py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((g: any) => (
                      <tr key={g.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3">{g.user?.firstName} {g.user?.lastName}</td>
                        <td className="py-3 font-medium">{g.title}</td>
                        <td className="py-3">{g.weight}%</td>
                        <td className="py-3">{g.targetDate ? new Date(g.targetDate).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(g.status)}`}>{g.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {managerReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Manager Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Manager Rating (1-5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setManagerReview({ ...managerReview, managerRating: star })}
                      className={`text-3xl ${star <= managerReview.managerRating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Overall Rating (1-5)</label>
                <input
                  type="number" min="1" max="5"
                  value={managerReview.overallRating}
                  onChange={(e) => setManagerReview({ ...managerReview, overallRating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comments</label>
                <textarea
                  value={managerReview.managerComments}
                  onChange={(e) => setManagerReview({ ...managerReview, managerComments: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  placeholder="Enter manager comments..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setManagerReview(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={handleManagerReview} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceManagePage;
