import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { getFromStorage, STORAGE_KEYS } from "../../../utils/localStorage";
import { Project, Budget, Milestone } from "../../../types/production";
import { useEffect, useState, useMemo } from "react";
import { FolderKanban, DollarSign, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { parseISO, min, max } from "date-fns";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { faker } from '@faker-js/faker'
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchProjects } from "../../../redux/slices/projectSlice";
import api from "../../../utils/axiosApi";
import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from '@/components/ui/shadcn-io/gantt';
import groupBy from 'lodash.groupby'
import { EyeIcon, LinkIcon, TrashIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';


const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const statuses = [
  { id: faker.string.uuid(), name: 'Planned', color: '#6B7280' },
  { id: faker.string.uuid(), name: 'In Progress', color: '#F59E0B' },
  { id: faker.string.uuid(), name: 'Done', color: '#10B981' },
];
const users = Array.from({ length: 4 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
  }));
const exampleGroups = Array.from({ length: 6 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: capitalize(faker.company.buzzPhrase()),
  }));
const exampleProducts = Array.from({ length: 4 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: capitalize(faker.company.buzzPhrase()),
  }));
const exampleInitiatives = Array.from({ length: 2 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: capitalize(faker.company.buzzPhrase()),
  }));
const exampleReleases = Array.from({ length: 3 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: capitalize(faker.company.buzzPhrase()),
  }));
const exampleFeatures = Array.from({ length: 20 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    name: capitalize(faker.company.buzzPhrase()),
    startAt: faker.date.past({ years: 0.5, refDate: new Date() }),
    endAt: faker.date.future({ years: 0.5, refDate: new Date() }),
    status: faker.helpers.arrayElement(statuses),
    owner: faker.helpers.arrayElement(users),
    group: faker.helpers.arrayElement(exampleGroups),
    product: faker.helpers.arrayElement(exampleProducts),
    initiative: faker.helpers.arrayElement(exampleInitiatives),
    release: faker.helpers.arrayElement(exampleReleases),
  }));
const exampleMarkers = Array.from({ length: 6 })
  .fill(null)
  .map(() => ({
    id: faker.string.uuid(),
    date: faker.date.past({ years: 0.5, refDate: new Date() }),
    label: capitalize(faker.company.buzzPhrase()),
    className: faker.helpers.arrayElement([
      'bg-blue-100 text-blue-900',
      'bg-green-100 text-green-900',
      'bg-purple-100 text-purple-900',
      'bg-red-100 text-red-900',
      'bg-orange-100 text-orange-900',
      'bg-teal-100 text-teal-900',
    ]),
  }));

const Timeline = () => {
  const [features, setFeatures] = useState(exampleFeatures);
  const groupedFeatures = groupBy(features, 'group.name');
  const sortedGroupedFeatures = Object.fromEntries(
    Object.entries(groupedFeatures).sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB)
    )
  );
  const handleViewFeature = (id: string) =>
    console.log(`Feature selected: ${id}`);
  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);
  const handleRemoveFeature = (id: string) =>
    setFeatures((prev) => prev.filter((feature) => feature.id !== id));
  const handleRemoveMarker = (id: string) =>
    console.log(`Remove marker: ${id}`);
  const handleCreateMarker = (date: Date) =>
    console.log(`Create marker: ${date.toISOString()}`);
  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) {
      return;
    }
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, startAt, endAt } : feature
      )
    );
    console.log(`Move feature: ${id} from ${startAt} to ${endAt}`);
  };
  const handleAddFeature = (date: Date) =>
    console.log(`Add feature: ${date.toISOString()}`);
  return (
    <GanttProvider
      className="border"
      onAddItem={handleAddFeature}
      range="monthly"
      zoom={100}
    >
      <GanttSidebar>
        {Object.entries(sortedGroupedFeatures).map(([group, features]) => (
          <GanttSidebarGroup key={group} name={group}>
            {features.map((feature) => (
              <GanttSidebarItem
                feature={feature}
                key={feature.id}
                onSelectItem={handleViewFeature}
              />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>
      <GanttTimeline>
        <GanttHeader />
        <GanttFeatureList>
          {Object.entries(sortedGroupedFeatures).map(([group, features]) => (
            <GanttFeatureListGroup key={group}>
              {features.map((feature) => (
                <div className="flex" key={feature.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => handleViewFeature(feature.id)}
                        type="button"
                      >
                        <GanttFeatureItem
                          onMove={handleMoveFeature}
                          {...feature}
                        >
                          <p className="flex-1 truncate text-xs">
                            {feature.name}
                          </p>
                          {feature.owner && (
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={feature.owner.image} />
                              <AvatarFallback>
                                {feature.owner.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </GanttFeatureItem>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleViewFeature(feature.id)}
                      >
                        <EyeIcon className="text-muted-foreground" size={16} />
                        View feature
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleCopyLink(feature.id)}
                      >
                        <LinkIcon className="text-muted-foreground" size={16} />
                        Copy link
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2 text-destructive"
                        onClick={() => handleRemoveFeature(feature.id)}
                      >
                        <TrashIcon size={16} />
                        Remove from roadmap
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>
        {exampleMarkers.map((marker) => (
          <GanttMarker
            key={marker.id}
            {...marker}
            onRemove={handleRemoveMarker}
          />
        ))}
        <GanttToday />
        <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
      </GanttTimeline>
    </GanttProvider>
  );
};


export default function ProjectManagementDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const organisationId = localStorage.getItem('organisationId');
  
  // Get projects from Redux
  const { projects = [], loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  
  // Get budgets from Redux (if available)
  const { budgets = [] } = useSelector((state: RootState) => state.budget);
  
  // Get WBS from Redux to check for project dates
  const { wbs: reduxWbs = [] } = useSelector((state: RootState) => state.wbs);
  
  // Local state to accumulate WBS from all projects
  const [allWbsItems, setAllWbsItems] = useState<any[]>([]);
  
  // Milestones still from localStorage for now
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Fetch projects from API
  useEffect(() => {
    if (organisationId) {
      dispatch(fetchProjects({ page: 1, limit: 100, status: "all", search: "" }));
    }
  }, [organisationId, dispatch]);

  // Fetch WBS for all projects to calculate dates
  useEffect(() => {
    if (projects.length > 0 && organisationId) {
      // Fetch WBS for each project and accumulate results
      const fetchAllWbs = async () => {
        const wbsPromises = projects.map(async (project) => {
          const projectId = project._id || project.id;
          if (!projectId) return [];
          
          try {
            const organisationId = localStorage.getItem("organisationId");
            if (!organisationId) return [];
            
            const response = await api.get(`/wbs/get/${projectId}`, {
              params: { organisationId },
            });
            
            // Map WBS items and add projectId to each
            return (response.data || []).map((item: any) => ({
              ...item,
              id: item._id || item.id,
              projectId: projectId, // Ensure projectId is set
            }));
          } catch (error) {
            console.error(`Error fetching WBS for project ${projectId}:`, error);
            return [];
          }
        });
        
        const allWbs = await Promise.all(wbsPromises);
        const flattenedWbs = allWbs.flat();
        setAllWbsItems(flattenedWbs);
        console.log("Fetched WBS for all projects:", flattenedWbs.length, "items");
      };
      
      fetchAllWbs();
    }
  }, [projects, organisationId]);

  // Load milestones from localStorage
  useEffect(() => {
    setMilestones(getFromStorage<Milestone>(STORAGE_KEYS.MILESTONES));
  }, []);

  // --- Prevent slider from going backward when at the beginning ---
  useEffect(() => {
    let ganttContainer: HTMLElement | null = null;
    let rafId: number | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const fixScroll = () => {
      if (!ganttContainer) return;
      if (ganttContainer.scrollLeft < 0) {
        ganttContainer.scrollLeft = 0;
      }
    };

    const handleScroll = () => {
      fixScroll();
      // Double-check in next frame
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(fixScroll);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!ganttContainer) return;
      if (e.deltaX < 0 && ganttContainer.scrollLeft <= 5) {
        e.preventDefault();
        e.stopPropagation();
        ganttContainer.scrollLeft = 0;
      }
    };

    const setupListeners = () => {
      ganttContainer = document.querySelector('.gantt.overflow-auto') as HTMLElement;
      if (!ganttContainer) {
        setTimeout(setupListeners, 100);
        return;
      }

      ganttContainer.addEventListener('scroll', handleScroll, { passive: false });
      ganttContainer.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      
      // Also check periodically as backup
      intervalId = setInterval(fixScroll, 50);
      
      // Initial check
      fixScroll();
    };

    const timer = setTimeout(setupListeners, 200);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
      if (rafId) cancelAnimationFrame(rafId);
      if (ganttContainer) {
        ganttContainer.removeEventListener('scroll', handleScroll);
        ganttContainer.removeEventListener('wheel', handleWheel, { capture: true });
      }
    };
  }, []);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  const overBudgetCount = budgets.filter((b) => b.status === "over-budget").length;

  // Convert projects to Gantt features format for timeline
  // Show projects that have dates (from project or WBS)
  const projectFeatures = useMemo(() => {
    if (projects.length === 0) return [];
    
    console.log("Calculating timeline features:", {
      projectsCount: projects.length,
      wbsCount: allWbsItems.length,
      wbsProjects: [...new Set(allWbsItems.map(w => w.projectId))]
    });
    
    const features = projects
      .map((project) => {
        const projectId = project._id || project.id;
        
        // Check if project has WBS items with dates - use accumulated WBS from all projects
        const projectWbsItems = allWbsItems.filter((item) => {
          const itemProjectId = item.projectId || (item as any)._id?.projectId || (item as any).projectId;
          // Convert both to strings for comparison
          return String(itemProjectId) === String(projectId);
        });
        
        console.log(`Project ${project.name} (${projectId}): Found ${projectWbsItems.length} WBS items, ${projectWbsItems.filter(i => i.startDate && i.endDate).length} with dates`);
        
        const wbsWithDates = projectWbsItems.filter(
          (item) => item.startDate && item.endDate
        );
        
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        // Priority 1: Use project dates if available
        if (project.startDate && project.endDate) {
          try {
            startDate = parseISO(project.startDate);
            endDate = parseISO(project.endDate);
          } catch (e) {
            console.error("Error parsing project dates:", e);
          }
        }
        
        // Priority 2: Use WBS dates if project dates not available
        if ((!startDate || !endDate) && wbsWithDates.length > 0) {
          const wbsStartDates = wbsWithDates
            .map((item) => {
              try {
                return parseISO(item.startDate!);
              } catch (e) {
                return null;
              }
            })
            .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
          
          const wbsEndDates = wbsWithDates
            .map((item) => {
              try {
                return parseISO(item.endDate!);
              } catch (e) {
                return null;
              }
            })
            .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
          
          if (wbsStartDates.length > 0 && wbsEndDates.length > 0) {
            startDate = min(wbsStartDates);
            endDate = max(wbsEndDates);
          }
        }
        
        // Skip if no dates found
        if (!startDate || !endDate) {
          return null;
        }

        // Ensure endDate is after startDate
        if (endDate < startDate) {
          // If end date is before start date, extend it
          endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        // Determine status color based on project status
        let statusColor = '#6B7280'; // Default grey
        let statusName = 'Planned';
        if (project.status === 'active') {
          statusColor = '#F59E0B';
          statusName = 'In Progress';
        } else if (project.status === 'completed') {
          statusColor = '#10B981';
          statusName = 'Done';
        } else if (project.status === 'planning') {
          statusColor = '#6B7280';
          statusName = 'Planned';
        }

        return {
          id: project.id || project._id || '',
          name: project.name || 'Unnamed Project',
          startAt: startDate,
          endAt: endDate,
          status: {
            id: project.status || 'planning',
            name: statusName,
            color: statusColor,
          },
          group: {
            name: project.status || 'Other',
          },
        };
      })
      .filter((feature): feature is NonNullable<typeof feature> => feature !== null);
    
    console.log("Project Features for Timeline:", features.length, "projects with dates");
    return features;
  }, [projects, allWbsItems]);

  const groupedProjectFeatures = groupBy(projectFeatures, 'group.name');
  const sortedGroupedProjectFeatures = Object.fromEntries(
    Object.entries(groupedProjectFeatures).sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB)
    )
  );

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "planning":
        return "bg-warning";
      case "completed":
        return "bg-muted";
      case "on-hold":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your project management activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">{activeProjects} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalBudget / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">Allocated budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalActualCost / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? ((totalActualCost / totalBudget) * 100).toFixed(1) : 0}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overBudgetCount}</div>
            <p className="text-xs text-muted-foreground">Over budget items</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects
              .filter((p) => p.status === "active" || p.status === "planning")
              .slice(0, 5)
              .map((project) => (
                <div key={project.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.client} • {project.location}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm font-medium">Progress: {project.progress}%</p>
                    <Progress value={project.progress} className="w-32" />
                  </div>
                </div>
              ))}
            {projects.filter((p) => p.status === "active" || p.status === "planning").length === 0 && (
              <p className="text-center text-muted-foreground py-4">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Timeline />
      
      {/* Projects Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Projects Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projectsLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No projects available to display on timeline.</p>
            </div>
          ) : projectFeatures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No projects with dates available. Please add dates to projects or WBS items.</p>
            </div>
          ) : (
            <GanttProvider
              className="border"
              range="monthly"
              zoom={100}
            >
              <GanttSidebar>
                {Object.entries(sortedGroupedProjectFeatures).map(([group, features]) => (
                  <GanttSidebarGroup key={group} name={capitalize(group)}>
                    {features.map((feature) => (
                      <GanttSidebarItem
                        feature={feature}
                        key={feature.id}
                        onSelectItem={(id) => {
                          const project = projects.find((p) => (p.id || p._id) === id);
                          if (project) {
                            console.log(`Project selected: ${project.name}`);
                          }
                        }}
                      />
                    ))}
                  </GanttSidebarGroup>
                ))}
              </GanttSidebar>
              <GanttTimeline>
                <GanttHeader />
                <GanttFeatureList>
                  {Object.entries(sortedGroupedProjectFeatures).map(([group, features]) => (
                    <GanttFeatureListGroup key={group}>
                      {features.map((feature) => (
                        <div className="flex" key={feature.id}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <button
                                onClick={() => {
                                  const project = projects.find((p) => (p.id || p._id) === feature.id);
                                  if (project) {
                                    console.log(`Project selected: ${project.name}`);
                                  }
                                }}
                                type="button"
                              >
                                <GanttFeatureItem
                                  onMove={(id, startAt, endAt) => {
                                    console.log(`Move project: ${id} from ${startAt} to ${endAt}`);
                                  }}
                                  {...feature}
                                >
                                  <p className="flex-1 truncate text-xs font-medium">
                                    {feature.name}
                                  </p>
                                </GanttFeatureItem>
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                className="flex items-center gap-2"
                                onClick={() => {
                                  const project = projects.find((p) => (p.id || p._id) === feature.id);
                                  if (project) {
                                    console.log(`Project selected: ${project.name}`);
                                  }
                                }}
                              >
                                <EyeIcon className="text-muted-foreground" size={16} />
                                View project
                              </ContextMenuItem>
                              <ContextMenuItem
                                className="flex items-center gap-2"
                                onClick={() => console.log(`Copy link: ${feature.id}`)}
                              >
                                <LinkIcon className="text-muted-foreground" size={16} />
                                Copy link
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </div>
                      ))}
                    </GanttFeatureListGroup>
                  ))}
                </GanttFeatureList>
                <GanttToday />
              </GanttTimeline>
            </GanttProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
