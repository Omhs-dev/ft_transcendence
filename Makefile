all:
	docker compose up --build
	@echo "$(ORG) ----- The project is run, check $(CYAN) http://localhost $(ORG)-----$(RESET)"

stop:
	@echo "$(ORG)----- Stoping containers$(MAGENTA) $(SERVICES) $(ORG) -----$(RESET)"
	docker compose down
	@rm -f ./backend/Django_backend_project/logs.txt
	@rm -rf ./backend/staticfiles

init_docker:
	@echo "$(ORG)----- Start Script-----$(RESET)"
	./script/init_docker.sh

reload: stop all 

clean:
	@echo "$(ORG)----- Cleaning stopped containers... -----$(RESET)"
	@docker compose rm 
	@rm -f ./backend/Django_backend_project/logs.txt
	@rm -rf ./backend/staticfiles
	
	@echo "$(ORG)----- Cleaning unused images... -----$(RESET)"	# @docker image prune -f
	@docker container prune -f


fclean:
	@echo "$(ORG)----- Stoping containers$(MAGENTA) $(SERVICES) $(ORG) -----$(RESET)"
	docker compose down -v
	@echo "$(ORG)----- Cleaning project docker initioation$(MAGENTA) $(SERVICES) $(ORG) -----$(RESET)"
	docker system prune -f
	docker image prune -af
	@rm -f ./backend/Django_backend_project/logs.txt
	@rm -rf ./backend/staticfiles

re: fclean all

BLUE    = \033[38;5;4m
GREEN   = \033[38;5;2m
ORG     = \033[38;5;214m
RED     = \033[38;5;196m
RESET   = \033[0m
CYAN	= \033[38;5;44m
MAGENTA	= \033[38;5;5m