import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaTruck, FaBoxOpen, FaRoute } from 'react-icons/fa';
import apiClient from '../../services/api';
import '../../App.css';

interface Job {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  weight: number; // in kg
}

interface Vehicle {
  id: string;
  reg: string;
  driver: string;
  capacity: number; // in kg
  currentLoad: number;
  jobs: Job[];
}

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: job.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-3 rounded shadow border">
      <p className="font-bold">{job.customer}</p>
      <p className="text-sm">{job.origin} ➔ {job.destination}</p>
      <p className="text-sm font-mono">{job.weight.toLocaleString()} kg</p>
    </div>
  );
};

const VehicleLane: React.FC<{ vehicle: Vehicle, jobs: Job[] }> = ({ vehicle, jobs }) => {
    const { setNodeRef } = useSortable({ id: vehicle.id });
    return (
        <div ref={setNodeRef} className="bg-gray-50 p-3 rounded border">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <p className="font-bold">{vehicle.reg} <span className="font-normal text-sm">({vehicle.driver})</span></p>
                    <p className="text-xs font-mono">Load: {vehicle.currentLoad.toLocaleString()} / {vehicle.capacity.toLocaleString()} kg</p>
                </div>
                <progress value={vehicle.currentLoad} max={vehicle.capacity} className="w-1/3"></progress>
            </div>
            <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[100px] space-y-2 p-2 bg-white rounded border-dashed border-2">
                    {jobs.map(job => <JobCard key={job.id} job={job} />)}
                    {jobs.length === 0 && <p className="text-center text-gray-400 text-sm">Drop jobs here</p>}
                </div>
            </SortableContext>
            <div className="mt-2 text-right">
                <button className="btn btn-secondary btn-sm"><FaRoute className="mr-2" /> Optimize Route</button>
            </div>
        </div>
    );
};


const LoadPlanning: React.FC = () => {
  const [unassignedJobs, setUnassignedJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, vehiclesRes] = await Promise.all([
          apiClient.get('/api/logistics/jobs?status=unassigned'),
          apiClient.get('/api/logistics/vehicles')
        ]);
        setUnassignedJobs(jobsRes.data.jobs || jobsRes.data || []);
        setVehicles((vehiclesRes.data.vehicles || vehiclesRes.data || []).map((v: any) => ({
          ...v,
          jobs: v.jobs || [],
          currentLoad: v.currentLoad || 0,
          capacity: v.capacity || 28000
        })));
      } catch (error) {
        console.error('Failed to fetch load planning data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const findContainer = (id: string) => {
    if (id === 'unassigned-jobs') {
      return { id, jobs: unassignedJobs };
    }
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      return { id, jobs: vehicle.jobs };
    }
    return undefined;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeContainer = findContainer(active.data.current?.sortable.containerId);
      const overContainer = findContainer(over.id.toString()) || findContainer(over.data.current?.sortable.containerId);
      
      if (!activeContainer || !overContainer) return;

      const activeIndex = activeContainer.jobs.findIndex(j => j.id === active.id);
      const job = activeContainer.jobs[activeIndex];

      if (activeContainer.id === overContainer.id) { // Reordering within the same container
        setVehicles(prev => prev.map(v => {
            if (v.id === activeContainer.id) {
                const newJobs = arrayMove(v.jobs, activeIndex, over.data.current?.sortable.index);
                return { ...v, jobs: newJobs };
            }
            return v;
        }));
        if (activeContainer.id === 'unassigned-jobs') {
            setUnassignedJobs(prev => arrayMove(prev, activeIndex, over.data.current?.sortable.index));
        }
      } else { // Moving between containers
        // Check capacity if moving to a vehicle
        if (overContainer.id !== 'unassigned-jobs') {
            const vehicle = vehicles.find(v => v.id === overContainer.id);
            if (vehicle && (vehicle.currentLoad + job.weight) > vehicle.capacity) {
                alert('Cannot assign job: Exceeds vehicle capacity.');
                return;
            }
        }

        // Remove from source
        if (activeContainer.id === 'unassigned-jobs') {
            setUnassignedJobs(prev => prev.filter(j => j.id !== active.id));
        } else {
            setVehicles(prev => prev.map(v => {
                if (v.id === activeContainer.id) {
                    return { ...v, jobs: v.jobs.filter(j => j.id !== active.id), currentLoad: v.currentLoad - job.weight };
                }
                return v;
            }));
        }

        // Add to destination
        if (overContainer.id === 'unassigned-jobs') {
            setUnassignedJobs(prev => {
                const newJobs = [...prev];
                newJobs.splice(over.data.current?.sortable.index || 0, 0, job);
                return newJobs;
            });
        } else {
            setVehicles(prev => prev.map(v => {
                if (v.id === overContainer.id) {
                    const newJobs = [...v.jobs];
                    newJobs.splice(over.data.current?.sortable.index || 0, 0, job);
                    return { ...v, jobs: newJobs, currentLoad: v.currentLoad + job.weight };
                }
                return v;
            }));
        }
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Load & Route Planning</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center"><FaBoxOpen className="mr-2" /> Unassigned Loads</h2>
            <SortableContext items={unassignedJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 min-h-[400px] bg-gray-50 p-2 rounded">
                {unassignedJobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </SortableContext>
          </div>

          <div className="col-span-2 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center"><FaTruck className="mr-2" /> Available Vehicles</h2>
            <div className="space-y-4">
              {vehicles.map(vehicle => (
                <VehicleLane key={vehicle.id} vehicle={vehicle} jobs={vehicle.jobs} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default LoadPlanning;
